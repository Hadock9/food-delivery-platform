db = db.getSiblingDB("TrackingServiceMongoDb");

db.createUser({
  user: "TrackingService",
  pwd: "TrackingService2025!",
  roles: [
    {
      role: "readWrite",
      db: "TrackingServiceMongoDb",
    },
  ],
});
