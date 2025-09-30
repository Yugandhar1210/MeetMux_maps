import Connection from "../models/Connection.js";
import User from "../models/User.js";

export const sendRequest = async (req, res) => {
  try {
    const { receiver } = req.body;
    if (receiver === req.user._id.toString())
      return res.status(400).json({ message: "Cannot connect to yourself" });
    const conn = await Connection.findOneAndUpdate(
      { requester: req.user._id, receiver },
      { requester: req.user._id, receiver, status: "pending" },
      { upsert: true, new: true }
    );
    return res.status(201).json(conn);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const respondRequest = async (req, res) => {
  try {
    const { status } = req.body; // accepted | rejected
    const updated = await Connection.findOneAndUpdate(
      { _id: req.params.id, receiver: req.user._id },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const listConnections = async (req, res) => {
  try {
    const me = req.user.id;
    const cons = await Connection.find({
      status: "accepted",
      $or: [{ requester: me }, { receiver: me }],
    })
      .populate({ path: "requester", select: "name email" })
      .populate({ path: "receiver", select: "name email" });

    // return the other party’s userId
    const ids = cons.map((c) =>
      String(c.requester?._id) === me ? c.receiver?._id : c.requester?._id
    );
    res.json(ids);
  } catch (e) {
    res
      .status(500)
      .json({ message: e.message || "Failed to list connections" });
  }
};

export const listRequests = async (req, res) => {
  try {
    const list = await Connection.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("requester", "name avatarUrl");
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
