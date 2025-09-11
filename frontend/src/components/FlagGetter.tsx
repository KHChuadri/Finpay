interface Props {
  countryCodes: string;
}

function FlagGetter({ countryCodes }: Props) {
  return (
    <img
      src={`https://flagcdn.com/${countryCodes.toLowerCase()}.svg`}
      width={1000}
      className="rounded-full h-[60px] w-[60px] object-cover border border-black"
    />
  );
}

export default FlagGetter;
