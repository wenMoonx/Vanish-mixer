import * as yup from "yup";
import { useForm } from "react-hook-form";
import { FormContainerUI } from "../../components/FormContainerUI";
import { TextFieldController } from "../../components/TextField";
import { yupResolver } from "@hookform/resolvers/yup";
import { useBalance, useAccount, useContractWrite, useWaitForTransaction, useToken, useContractRead } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { VanishEarned } from "./VanishEarned";
import { StakeInfo } from "./StakeInfo";
import { SwitchFieldController } from "../../components/SwitchField";
import { FormatNumber } from "../../components/FormatNumber";
import VanishStakingABI from "../../ABI/VanishStaking.json";
import ShibvAnonABI from "../../ABI/ShibAnon.json";

export const StakeVanishForm = () => {
  const shibaStakingAddress = '0xFC9451410E676eb099D0c2FC2B28936136c2B8A3';
  const shibAnonAddress = '0x68985eE4231606f5f5759ae81444066439a03Ff7';

  const [available, setAvailable] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [claimableAmount, setClaimableAmount] = useState(0);

  const { address: userWallet } = useAccount();
  const balance = useBalance({
    address: userWallet,
    token: shibAnonAddress,
  });

  const schema = useMemo(() => {
    return yup.object({
      amount: yup
        .number()
        .typeError("This field is required")
        .min(0.00001, "Amount should be bigger than 0.00001")
        .max(available, `Amount should not be bigger than ${available}`)
        .required("This field is required"),
    });
  }, [available]);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      stake: true,
      amount: "",
    },
  });

  const { data: vanishToken } = useToken({
    address: shibAnonAddress,
  });
  
  const { write: deposit} = useContractWrite({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'deposit',
  });
  
  const { writeAsync: withdrawCapital } = useContractWrite({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'withdrawCapital',
  });
  
  const { writeAsync: claimReward } = useContractWrite({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'claimReward',
  });
  
  const { writeAsync: approve } = useContractWrite({
    address: shibAnonAddress,
    abi: ShibvAnonABI,
    functionName: 'approve'
  });
  
  const { data: allowanceR } = useContractRead({
    address: shibAnonAddress,
    abi: ShibvAnonABI,
    functionName: 'allowance',
    args: [userWallet, shibaStakingAddress]
  });
  
  const { data: claimableAmountR } = useContractRead({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'getClaimableAmount',
    args: [userWallet, 0] // investor wallet, nftBalance
  });
  
  // const { data: totalInvestsR } = useContractRead({
  //   address: shibaStakingAddress,
  //   abi: VanishStakingABI,
  //   functionName: 'getTotalInvests',
  // });
  
  const { data: depositInfo } = useContractRead({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'depositInfo',
    args: [userWallet]
  });
  
  const { data: claimInfo } = useContractRead({
    address: shibaStakingAddress,
    abi: VanishStakingABI,
    functionName: 'claimInfo',
    args: [userWallet]
  });


  // const totalInvests = formatUnits(totalInvestsR, vanishToken?.decimals);
  // const { isLoading, isSuccess, isError: isWaitError } = useWaitForTransaction({
  //   hash: stakeTx?.hash,
  // });

  const stakeUnstake = async (values) => {
    try {
      if (values.stake) {
        if (claimableAmount > 0) {
          await claimReward();
        } else if (allowance > 0) {
          deposit({args: [parseUnits(parseFloat(values.amount).toString(), vanishToken?.decimals)]});
        } else {
          await approve({args: [shibaStakingAddress, parseUnits(parseFloat(values.amount).toString(), vanishToken?.decimals)]});
        }
      } else {
        await withdrawCapital({args: [values.amount]});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const stake = watch("stake");

  const expiryTimestamp = useMemo(
    () => claimInfo ? new Date(claimInfo[2] - Date.now()).getTime() : "",
    []
  );

  const handleAmountButtonClick = (percentage) => () => {
    let amount = ((available || 0) * percentage) / 100;
    amount = parseFloat(amount.toFixed(12)); // TODO: not sure how many decimals should there be
    setValue("amount", amount, { shouldValidate: true });
  };

  useEffect(() => {
    if (userWallet) {
      setAvailable(formatUnits(balance?.data?.value, balance?.data?.decimals));
      setAllowance(formatUnits(allowanceR, vanishToken?.decimals));
      setClaimableAmount(formatUnits(claimableAmountR, vanishToken?.decimals));
    }
  }, [userWallet]);

  return (
    <FormContainerUI title="Stake Vanish">
      <form
        onSubmit={handleSubmit(stakeUnstake)}
        autoComplete="off"
        className="flex flex-col gap-[15px]"
      >
        <div className="mt-[25px]">
          <VanishEarned amount={claimInfo ? parseInt(claimInfo[0]) : 0} expiryTimestamp={expiryTimestamp} />
        </div>

        <SwitchFieldController
          name="stake"
          control={control}
          options={[
            { value: true, title: "Stake" },
            { value: false, title: "Unstake" },
          ]}
        />

        <TextFieldController
          label="Enter Amount"
          helpText={
            <>
              <span className="text-white/50">Available:</span>{" "}
              {available ? <FormatNumber value={available} /> : "00"}
            </>
          }
          placeholder="Enter Amount"
          name="amount"
          control={control}
          inputProps={{
            className: "pr-[80px] pl-[125px] max-sm:px-5",
            isAllowed: (values) => {
              const { floatValue } = values;
              console.log("floatValue", floatValue);
              return !floatValue || floatValue <= available;
            },
          }}
          type="number"
          prepend="$VANISH"
          prependClassName="max-sm:hidden"
          append={
            <button
              type="button"
              onClick={handleAmountButtonClick(100)}
              className="text-red font-medium tracking-button"
            >
              MAX
            </button>
          }
        />

        <StakeInfo amount={depositInfo ? parseInt(depositInfo[0]) : 0} apr="100" />

        <Button color="primary" disabled={isSubmitting} type="submit">
          {stake ? claimableAmount > 0 ? "Claim" : allowance > 0 ? `Stake (${allowance} Approved)` : "Approve" : "Unstake"} {isSubmitting && "..."}
        </Button>
      </form>
    </FormContainerUI>
  );
};
