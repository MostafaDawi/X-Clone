import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json({ notifications });
  } catch (error) {
    console.log("Error fetching the notifications", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    const notification = await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "All notifications have been deleted" });
  } catch (error) {
    console.log("Error deleting notifications", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
