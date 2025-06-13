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

// Max Listeners Limit
events.defaultMaxListeners = 20;

// ─────────────── Socket.io ───────────────
io.on("connection", (socket) => {
  console.log(`Client Connected: ${socket.id}`);

  socket.on("registerCall", (data) => {
    if (data?.uniqueid) {
      const roomName = `call_${data.uniqueid}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    }
  });

  socket.on("registerAdmin", (data) => {
    if (data?.roomId) {
      const roomName = `admin_${data.roomId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined admin room ${roomName}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
    socket.removeAllListeners();
  });
});
const updateConnectivityStatus = async () => {
  try {
    console.log("Fetching device connectivity statuses...");
    const batteryStatuses = await Battery.find({}, 'uniqueid connectivity timestamp');
    const devices = await Device.find({}, 'brand _id');

    const statusList = devices.map(device => {
      const battery = batteryStatuses.find(b => b.uniqueid === device._id.toString());
      return {
        _id: device._id,
        brand: device.brand,
        uniqueid: device._id,
        connectivity: battery ? battery.connectivity : "Offline"
      };
    });

    io.emit("batteryUpdate", statusList);
  } catch (error) {
    console.error("Error updating connectivity status:", error);
  }
};

let batteryUpdateTimeout;
try {
  const batteryChangeStream = Battery.watch([], { fullDocument: 'updateLookup' });
  batteryChangeStream.setMaxListeners(20);
  batteryChangeStream.on("change", (change) => {
    console.log("Battery change detected:", change.operationType);
    clearTimeout(batteryUpdateTimeout);
    batteryUpdateTimeout = setTimeout(() => {
      updateConnectivityStatus();
    }, 2000); // Faster response for connectivity change
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
      await Battery.updateMany(
        { uniqueid: { $in: stale.map(d => d.uniqueid) } },
        { $set: { connectivity: "Offline" } }
      );
      console.log("Marked devices offline:", stale.map(d => d.uniqueid));
      updateConnectivityStatus();
    }
  } catch (err) {
    console.error("Error checking offline devices:", err);
  }
};
setInterval(checkOfflineDevices, 10000);

// ───────── Call Change Stream ─────────
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

// ───────── Admin Change Stream ─────────
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
