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

// Routes
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

// ─────────────────── Socket.io ───────────────────
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  // join call room
  socket.on("registerCall", (data) => {
    if (data?.uniqueid) {
      const roomName = `call_${data.uniqueid}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    }
  });

  // join admin room
  socket.on("registerAdmin", (data) => {
    if (data?.roomId) {
      const roomName = `admin_${data.roomId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined admin room ${roomName}`);
    }
  });

  // NEW: join status room
  socket.on("registerStatus", (data) => {
    if (data?.uniqueid) {
      const roomName = `status_${data.uniqueid}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined status room ${roomName}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
    socket.removeAllListeners();
  });
});

// emit a single-device statusUpdate to its room
const emitStatusUpdate = (uniqueid, connectivity, timestamp) => {
  const payload = { uniqueid, connectivity, updatedAt: timestamp };
  const room = `status_${uniqueid}`;
  io.to(room).emit("statusUpdate", payload);
  console.log("Emitted statusUpdate to", room, "→", payload);
};

// ───────────── Battery change stream ─────────────
try {
  const batteryChangeStream = Battery.watch([], { fullDocument: 'updateLookup' });
  batteryChangeStream.setMaxListeners(20);

  batteryChangeStream.on("change", (change) => {
    console.log("Battery change detected:", change.operationType);
    const doc = change.fullDocument;
    if (doc) {
      emitStatusUpdate(doc.uniqueid, doc.connectivity, doc.timestamp);
    }
  });

  batteryChangeStream.on("error", (err) => {
    console.error("Battery Change Stream error:", err);
  });
} catch (err) {
  console.error("Error initializing battery change stream:", err);
}

// ───────── Offline Device Checker ─────────
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
      await Battery.updateMany(
        { uniqueid: { $in: ids } },
        { $set: { connectivity: "Offline", timestamp: Date.now() } }
      );
      console.log("Marked devices offline:", ids);
      // emit per-device offline updates
      stale.forEach(d =>
        emitStatusUpdate(d.uniqueid, "Offline", Date.now())
      );
    }
  } catch (err) {
    console.error("Error checking offline devices:", err);
  }
};
setInterval(checkOfflineDevices, 10000);

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
