require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const events = require('events');
const { Server } = require('socket.io');

const Battery = require('./models/Battery');
const Device = require('./models/Device');
const Call = require('./models/Call');
const Admin = require('./models/Admin');

const connectDB = require('./config/dbConfig');
const authController = require('./controllers/authController');
const authRouter = require('./routes/authRouter');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const detail = require('./routes/detail');
const statusRoutes = require('./routes/StatusRoutes');
const simRoutes = require("./routes/simRoutes");
const simSlotRoutes = require('./routes/simSlot');
const allRoute = require("./routes/allformRoutes");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());

// Initialize Admin
authController.initializeAdmin();

// Routes (existing logic unchanged)
app.use('/api/auth', authRouter);
app.use('/api/device', deviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', simSlotRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/data', detail);
app.use('/api/status', statusRoutes);
app.use('/api/sim', simRoutes);
app.use('/api/all', allRoute);

// Increase max listeners to avoid warnings
events.defaultMaxListeners = 20;

// Helper: mark device status in DB and emit real-time
async function markDeviceStatus(uniqueid, status) {
  try {
    const now = new Date();
    await Battery.findOneAndUpdate(
      { uniqueid },
      { $set: { connectivity: status, timestamp: now } },
      { upsert: true }
    );
    io.to(`status_${uniqueid}`).emit("statusUpdate", {
      uniqueid,
      connectivity: status,
      updatedAt: now.getTime()
    });
    console.log(`Marked ${uniqueid} as ${status}`);
  } catch (err) {
    console.error("Error in markDeviceStatus:", err);
  }
}

// Socket.io real-time handlers
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  // registerCall (existing)
  socket.on("registerCall", (data) => {
    if (data?.uniqueid) {
      const roomName = `call_${data.uniqueid}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    }
  });

  // registerAdmin (existing)
  socket.on("registerAdmin", (data) => {
    if (data?.roomId) {
      const roomName = `admin_${data.roomId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined admin room ${roomName}`);
    }
  });

  // NEW: registerStatus - join status room and mark Online immediately
  socket.on("registerStatus", (data) => {
    if (data?.uniqueid) {
      const uniqueid = data.uniqueid;
      socket.data.uniqueid = uniqueid;
      const room = `status_${uniqueid}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined status room ${room}`);
      // Mark Online on join
      markDeviceStatus(uniqueid, "Online");
    }
  });

  // Optional: handle explicit connectivityUpdate from client (on network change)
  socket.on("connectivityUpdate", async (data) => {
    const { uniqueid, connectivity, timestamp } = data;
    if (!uniqueid || !connectivity) {
      console.warn("connectivityUpdate missing fields:", data);
      return;
    }
    try {
      const tsDate = timestamp ? new Date(timestamp) : new Date();
      await Battery.findOneAndUpdate(
        { uniqueid },
        { $set: { connectivity, timestamp: tsDate } },
        { upsert: true }
      );
      io.to(`status_${uniqueid}`).emit("statusUpdate", {
        uniqueid,
        connectivity,
        updatedAt: tsDate.getTime()
      });
      console.log(`Received connectivityUpdate ${uniqueid}: ${connectivity}`);
    } catch (err) {
      console.error("Error handling connectivityUpdate:", err);
    }
  });

  // On disconnect: mark Offline immediately
  socket.on("disconnect", (reason) => {
    const uniqueid = socket.data.uniqueid;
    if (uniqueid) {
      console.log(`Socket disconnected for ${uniqueid}, reason: ${reason}`);
      markDeviceStatus(uniqueid, "Offline");
    } else {
      console.log(`Socket disconnected: ${socket.id}, no uniqueid stored`);
    }
  });
});

// emit a single-device statusUpdate to its room (used by change streams or offline-checker if needed)
const emitStatusUpdate = (uniqueid, connectivity, timestamp) => {
  const payload = { uniqueid, connectivity, updatedAt: timestamp };
  const room = `status_${uniqueid}`;
  io.to(room).emit("statusUpdate", payload);
  console.log("Emitted statusUpdate to", room, "→", payload);
};

// ───────────── Battery change stream (optional) ─────────────
// If you want to keep DB-change-based emits for other updates, you can keep this.
// Be aware: explicit emits in connectivityUpdate handler + markDeviceStatus might duplicate.
try {
  const batteryChangeStream = Battery.watch([], { fullDocument: 'updateLookup' });
  batteryChangeStream.setMaxListeners(20);

  batteryChangeStream.on("change", (change) => {
    console.log("Battery change detected:", change.operationType);
    const doc = change.fullDocument;
    if (doc) {
      // You may skip if this change originated from socket disconnect/update
      emitStatusUpdate(
        doc.uniqueid,
        doc.connectivity,
        (doc.timestamp instanceof Date ? doc.timestamp.getTime() : doc.timestamp)
      );
    }
  });

  batteryChangeStream.on("error", (err) => {
    console.error("Battery Change Stream error:", err);
  });
} catch (err) {
  console.error("Error initializing battery change stream:", err);
}

// ───────── Offline Device Checker (optional backup) ─────────
// Since disconnect logic handles offline in real-time, this is optional.
// If you want a fallback, you can keep it; otherwise you may comment it out.
const checkOfflineDevices = async () => {
  try {
    const thresholdMs = 12000;
    const cutoff = new Date(Date.now() - thresholdMs);

    const stale = await Battery.find({
      connectivity: "Online",
      timestamp: { $lt: cutoff }
    });

    if (stale.length > 0) {
      const ids = stale.map(d => d.uniqueid);
      const now = new Date();
      await Battery.updateMany(
        { uniqueid: { $in: ids } },
        { $set: { connectivity: "Offline", timestamp: now } }
      );
      console.log("Marked devices offline by checker:", ids);
      stale.forEach(d =>
        emitStatusUpdate(d.uniqueid, "Offline", now.getTime())
      );
    }
  } catch (err) {
    console.error("Error checking offline devices:", err);
  }
};
// If you want backup checking, uncomment next line; else leave commented.
// setInterval(checkOfflineDevices, 10000);

// ───────────── Call change stream ─────────────
const initCallChangeStream = () => {
  try {
    const pipeline = [{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }];
    const stream = Call.watch(pipeline, { fullDocument: 'updateLookup' });
    stream.setMaxListeners(20);

    stream.on("change", (change) => {
      const doc = change.fullDocument;
      if (doc) emitCallUpdate(doc);
      else if (change.documentKey?._id) {
        Call.findById(change.documentKey._id)
          .then(d => d && emitCallUpdate(d))
          .catch(err => console.error("Fetch fallback failed:", err));
      }
    });

    stream.on("error", err => console.error("Call stream error:", err));
  } catch (err) {
    console.error("Error initializing Call stream:", err);
  }
};

const emitCallUpdate = (doc) => {
  const payload = {
    _id: doc._id,
    call_id: doc.call_id,
    code: doc.code,
    sim: doc.sim,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt
  };
  const room = `call_${doc.call_id}`;
  io.to(room).emit("callUpdate", payload);
  console.log("Emitted callUpdate:", payload);
};

// ───────────── Admin change stream ─────────────
const initAdminChangeStream = () => {
  try {
    const pipeline = [{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }];
    const stream = Admin.watch(pipeline, { fullDocument: 'updateLookup' });
    stream.setMaxListeners(20);

    stream.on("change", (change) => {
      const doc = change.fullDocument;
      if (doc) emitAdminUpdate(doc);
      else if (change.documentKey?._id) {
        Admin.findById(change.documentKey._id)
          .then(d => d && emitAdminUpdate(d))
          .catch(err => console.error("Admin fetch fallback failed:", err));
      }
    });

    stream.on("error", err => console.error("Admin stream error:", err));
  } catch (err) {
    console.error("Error initializing Admin stream:", err);
  }
};

const emitAdminUpdate = (doc) => {
  const payload = {
    _id: doc._id,
    phoneNumber: doc.phoneNumber
  };
  io.emit("adminUpdate", payload);
  console.log("Emitted adminUpdate:", payload);
};

initCallChangeStream();
initAdminChangeStream();

// ───────────────── Server start ─────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
