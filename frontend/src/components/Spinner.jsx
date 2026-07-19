import { Loader2 } from 'lucide-react';

const Spinner = ({ size = "w-8 h-8" }) => {
  return (
    <div className="flex justify-center items-center h-full w-full min-h-[100px]">
      <Loader2 className={`animate-spin text-[#00a884] ${size}`} />
    </div>
  );
};

export default Spinner;
