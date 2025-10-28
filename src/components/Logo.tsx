import logo from "../assets/logo.png";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return <img src={logo} alt="Logo" className={className} />;
  // return <LogoSvg className="h-8 w-auto" />;
};

export default Logo;
