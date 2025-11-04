const Watermark = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <img 
        src="/logo.png" 
        alt="Watermark" 
        className="w-full h-full object-contain opacity-5 select-none"
      />
    </div>
  );
};

export default Watermark;
