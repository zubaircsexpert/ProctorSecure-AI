const WarningModal = ({ message }) => {
  return (
    <div className="warning-overlay">
      <div className="warning-box">
        <h3>⚠ Warning Detected</h3>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default WarningModal;