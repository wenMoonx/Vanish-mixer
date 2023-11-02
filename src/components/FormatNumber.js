import { NumericFormat } from "react-number-format"

export const FormatNumber = ({ value, className, ...rest }) => {
  return <NumericFormat
  displayType="text"
  value={value}
  decimalSeparator="."
  thousandSeparator=","
  className={className}
  {...rest}
/>
}

export const getEllipsisTxt = (str, n = 6) => {
  if (str) {
    return `${str.slice(0, n - 1)}...${str.slice(str.length - n)}`
  }
  return ''
}

export const truncateAddress = (address) => {
  if (!address) return "No Account";
  const match = address.match(
    /^(0x[a-zA-Z0-9]{2})[a-zA-Z0-9]+([a-zA-Z0-9]{2})$/
  );
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};