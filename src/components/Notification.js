import React, { useEffect } from "react";

const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className="notification">{message}</div>;
};

export default Notification;
