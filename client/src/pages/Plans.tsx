import Pricing from "../components/Pricing";

function Plans() {
  return (
    <div className="max-sm:py-10 sm:pt-20">
      <Pricing />
      <p className="text-center text-gray-400 mx-w-md text-sm my-14 mx-auto px-12">
        Create stunning images for just{" "}
        <span className="text-primary-400 font-medium">5 credits</span> and
        generate immersive videos for{" "}
        <span className="text-primary-400 font-medium">10 credits</span>.
      </p>
    </div>
  );
}

export default Plans;
