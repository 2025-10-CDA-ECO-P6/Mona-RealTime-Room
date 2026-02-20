import './ButtonInfo.scss';

type ButtonInfoProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

export default function ButtonInfo({ children, disabled = false }: ButtonInfoProps) {
  return (
    <button className="button_info" disabled={disabled}>
      {children}
    </button>
  );
}
