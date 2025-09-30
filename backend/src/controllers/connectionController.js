import Connection from "../models/Connection.js";
import User from "../models/User.js";

export const sendRequest = async (req, res) => {
  try {
    const requester = req.user.id;
    const { receiverId } = req.body;
    if (!receiverId)
      return res.status(400).json({ message: "receiverId is required" });
    if (receiverId === requester)
      return res.status(400).json({ message: "Cannot connect to yourself" });

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) return res.status(404).json({ message: "User not found" });

    const existing = await Connection.findOne({
      $or: [
        { requester, receiver: receiverId },
        { requester: receiverId, receiver: requester },
      ],
    });
    if (existing) {
      if (existing.status === "accepted")
        return res.status(400).json({ message: "Already connected" });
      if (existing.status === "pending")
        return res.status(400).json({ message: "Request already pending" });
      await Connection.deleteOne({ _id: existing._id });
    }

    const doc = await Connection.create({
      requester,
      receiver: receiverId,
      status: "pending",
    });
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000)
      return res.status(400).json({ message: "Request already exists" });
    res.status(500).json({ message: e.message || "Failed to send request" });
  }
};

export const respondRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId, action } = req.body;
    if (!requestId || !["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    const doc = await Connection.findById(requestId);
    if (!doc) return res.status(404).json({ message: "Request not found" });
    if (String(doc.receiver) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized to respond" });
    }
    doc.status = action === "accept" ? "accepted" : "rejected";
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to respond" });
  }
};

export const listRequests = async (req, res) => {
  try {
    const me = req.user.id;
    const docs = await Connection.find({ receiver: me, status: "pending" })
      .populate({ path: "requester", select: "name email avatarUrl" })
      .sort({ createdAt: -1 });
    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load requests" });
  }
};

export const listConnections = async (req, res) => {
  try {
    const me = String(req.user.id);
    const cons = await Connection.find({
      status: "accepted",
      $or: [{ requester: me }, { receiver: me }],
    })
      .populate({
        path: "requester",
        select: "name email avatarUrl location interests status isOnline",
      })
      .populate({
        path: "receiver",
        select: "name email avatarUrl location interests status isOnline",
      })
      .lean();

    // return the OTHER user as a user object
    const users = cons
      .map((c) => (String(c.requester?._id) === me ? c.receiver : c.requester))
      .filter(Boolean);
    res.json(users);
  } catch (e) {
    res
      .status(500)
      .json({ message: e.message || "Failed to list connections" });
  }
};
