import { useEffect, useState, useMemo } from "react";
import * as yup from "yup";
import { useForm, useWatch } from "react-hook-form";
import { useBalance, useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { toast } from "react-toastify";
import { parseEther } from 'viem';
import {
  Divider,
  FormContainerUI,
  FormTitle,
} from "../components/FormContainerUI";
import { TextField, TextFieldController } from "../components/TextField";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TOKEN,
  TOKEN_NAME,
  RECEPIENT_WALLET_ADDRESS_MAX_LENGTH,
  RECEPIENT_WALLET_ADDRESS_MIN_LENGTH,
} from "../constants";
import { Button } from "../components/Button";
import { DropdownFieldController } from "../components/DropdownField";
import { tokensOptions } from "../constants/tokens";
import { isWalletValid } from "../utils/isWalletValid";
import { FormatNumber } from "../components/FormatNumber";
import MixerABI from "../ABI/Mixer.json";

export const SendTransferForm = () => {
  const fee = 0.002;
  const [balance, setBalance] = useState(0);
  const { address } = useAccount();
  const { data } = useBalance({
    address: address,
    watch: true,
  });
  
  const { write: writeMixer, data: tx, isError, error } = useContractWrite({
    address: '0xdF9B91aC0E917eA8443b4b7990DF5D88c1410904',
    abi: MixerABI,
    functionName: 'split',
  });

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: tx?.hash,
  });

  useEffect(() => {
    setBalance(parseFloat(data?.formatted).toFixed(3));
  }, [data]);

  useEffect(() => {
    if (isSuccess) toast.success("Congratulations! Successfully Transfered.");
  }, [isSuccess]);

  useEffect(() => {
    console.log(error);
    if (isError) toast.error(error.message);
  }, [isError]);


  const schema = useMemo(() => {
    return yup.object({
      recepientWallet: yup
        .string()
        .min(
          RECEPIENT_WALLET_ADDRESS_MIN_LENGTH,
          "Recipient Wallet Address is too short"
        )
        .test("wallet-validate", "Wallet address is invalid", (wallet) =>
          isWalletValid(wallet)
        )
        .max(
          RECEPIENT_WALLET_ADDRESS_MAX_LENGTH,
          `Recipient Wallet Address is too long`
        )
        .required("Recipient Wallet Address  is missing"),
      amount: yup
        .number()
        .typeError("This field is required")
        .min(0.003, "Amount should be bigger than 0.003")
        .max((balance), `Amount should not be bigger than ${balance}`)
        .required("This field is required"),
    });
  }, [balance]);

  const {
    handleSubmit,
    setValue,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      recepientWallet: "",
      amount: 0,
      sourceToken: TOKEN.ETH,
      destinationToken: TOKEN.ETH,
    },
  });

  const { amount: sendAmount } = useWatch({ control })

  const sendTransfer = (input) => {
    console.log({input});
    try {
      writeMixer({  
        args: [input.recepientWallet, Math.floor(Math.random() * (800 - 300 + 1)) + 300],
        value: parseEther(parseFloat(input.amount).toString()),
      });
    } catch (error) {
      console.log({error});
    }
  };

  const pButtons = [25, 50, 75, 100];

  const handleAmountButtonClick = (percentage) => () => {
    percentage = percentage === 100 ? 99.99999 : percentage;
    let amount = (balance || 0) * percentage / 100;
    setValue("amount", amount, { shouldValidate: true });
  };

  const sourceToken = watch("sourceToken");
  const destinationToken = watch("destinationToken");

  return (
    <FormContainerUI title="You Send">
      <form
        onSubmit={handleSubmit(sendTransfer)}
        autoComplete="off"
        className="flex flex-col gap-[20px]"
      >
        <DropdownFieldController
          label="Select source currency"
          name="sourceToken"
          append={
            <span className="text-white/60">
              {TOKEN_NAME[sourceToken]} ({sourceToken})
            </span>
          }
          control={control}
          options={tokensOptions}
          dropdownTitle="Select a Token"
        />

        <TextFieldController
          label="Enter Amount"
          helpText={
            <>
              <span className="text-white/50">Available:</span>{" "}
              {data ? <FormatNumber value={balance} /> : "0.0"}
            </>
          }
          placeholder="Enter Amount"
          name="amount"
          control={control}
          type="number"
          inputProps={{
            className: "pr-[80px]",
            isAllowed: (values) => {
              const { floatValue } = values;
              console.log("floatValue", floatValue);
              return !floatValue || floatValue <= balance;
            },
          }}
          append={
            <button
              type="button"
              onClick={handleAmountButtonClick(100)}
              className="text-red font-medium text-sm tracking-button"
            >
              MAX
            </button>
          }
        />

        <div className="flex justify-between gap-3">
          {pButtons.map((b, idx) => (
            <Button
              key={idx}
              color="secondary-outlined"
              size="medium"
              className="w-full"
              onClick={handleAmountButtonClick(b)}
            >
              {b}%
            </Button>
          ))}
        </div>

        <Divider />

        <FormTitle>You Get</FormTitle>

        <DropdownFieldController
          label="Destination currency"
          name="destinationToken"
          append={
            <span className="text-white/60">
              {TOKEN_NAME[destinationToken]} ({destinationToken})
            </span>
          }
          control={control}
          options={tokensOptions}
          dropdownTitle="Select a Token"
        />

        <TextFieldController
          label="Recipient Wallet Address"
          placeholder="Enter wallet address"
          name="recepientWallet"
          control={control}
        />

        <TextField
          label="FEE"
          placeholder="Total"
          name="recepientWallet"
          helpText={fee + ' ETH'}
          infoTooltip={(
            <>
              <div><span className="text-red font-bold">2%</span> - standard fee <span className="text-red">(current)</span></div>
              <div><span className="text-red font-bold">0%</span> - available for NFT holders</div>
            </>
          )}
          readOnly
          inputProps={{
            className: "placeholder-white/60",
          }}
          append={<span className="text-white text-base">{sendAmount > fee ? sendAmount - fee : 0} ETH</span>}
        />

        <Button color="primary" type="submit" disabled={isLoading}>
          Transfer Now {(isLoading) && "..."}
        </Button>
      </form>
    </FormContainerUI>
  );
};
