import Connection from "../models/Connection.js";

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
    const list = await Connection.find({
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
      status: "accepted",
    })
      .populate("requester", "name avatarUrl")
      .populate("receiver", "name avatarUrl");
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
