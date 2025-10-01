import MapView from "../components/MapView";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      {/* <div className="absolute z-[1000] top-4 right-4 bg-white rounded shadow px-3 py-2 text-sm font-medium">
        MeetMux — Social Map
      </div> */}
      <MapView />
    </div>
  );
}
