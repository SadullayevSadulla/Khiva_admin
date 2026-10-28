import './loader.css';

export default function Loader({ fullHeight = true }) {
  return (
    <div className={`loader-wrapper ${fullHeight ? 'loader-wrapper--full' : ''}`}>
      <span className="loader"></span>
    </div>
  );
}