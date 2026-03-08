import Notification from "../models/Notification.mjs";


// logic to create a notification
export const createNotification = async (req, res, next) => {
  try {

    const { user, message, type } = req.body;

    const notification = new Notification({
      user,
      message,
      type,
      isRead: false
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification
    });

  } catch (error) {
    next(error);
  }
};



// logic to mark notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {

    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });

  } catch (error) {
    next(error);
  }
};



// logic to delete notification
export const deleteNotification = async (req, res, next) => {
  try {

    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
export const getUserNotifications = async (req, res, next) => {
  try {

    const notifications = await Notification
      .find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    next(error);
  }
};
export const getUnreadNotifications = async (req, res, next) => {
  try {

    const notifications = await Notification.find({
      user: req.user.id,
      isRead: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    next(error);
  }
};
export const getNotificationCount = async (req, res, next) => {
  try {

    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unread: count
    });

  } catch (error) {
    next(error);
  }
};
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {

    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    next(error);
  }
};
export const deleteAllNotifications = async (req, res, next) => {
  try {

    await Notification.deleteMany({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: "All notifications deleted"
    });

  } catch (error) {
    next(error);
  }
};
export const getNotificationById = async (req, res, next) => {
  try {

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    next(error);
  }
};