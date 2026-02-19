import './button.scss';

type ButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

export default function Button({ children, disabled = false }: ButtonProps) {
  return (
    <button className="btn" disabled={disabled}>
      {children}
    </button>
  );
}
