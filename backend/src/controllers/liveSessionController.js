import LiveSession from "../models/livesession.js";

export const startSession = async (req, res) => {
  try {
    const { sessionId, users } = req.body;
    const doc = await LiveSession.findOneAndUpdate(
      { sessionId },
      { sessionId, users, isActive: true, startedBy: req.user._id },
      { upsert: true, new: true }
    );
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lat, lng } = req.body;
    await LiveSession.findOneAndUpdate(
      { sessionId, isActive: true },
      { $pull: { liveLocations: { userId: req.user._id } } }
    );
    const doc = await LiveSession.findOneAndUpdate(
      { sessionId, isActive: true },
      {
        $push: {
          liveLocations: {
            userId: req.user._id,
            lat,
            lng,
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const doc = await LiveSession.findOneAndUpdate(
      { sessionId },
      { isActive: false, endedAt: new Date() },
      { new: true }
    );
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const doc = await LiveSession.findOne({ sessionId });
    if (!doc) return res.status(404).json({ message: "Session not found" });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
