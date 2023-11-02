import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import logo from "../assets/images/logo.svg";
import { WalletIcon } from "./icons/WalletIcon";
import { getEllipsisTxt } from "./FormatNumber";

export const Header = () => {
  const { address, connector, isConnected } = useAccount();
  const { data: ensAvatar } = useEnsAvatar({ address });
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  return (
    <header className="relative pl-[4.5rem] pr-[5.66rem] flex items-center justify-between pt-[2.06rem] max-md:pl-8 max-md:pr-8 max-sm:px-3">
      <a href="/">
        <img
          src={logo}
          width={110}
          height={106.291428}
          alt="Logo"
          className="max-sm:w-[100px]"
        />
      </a>

      {!isConnected ? (
        <button
          onClick={() => connect()}
          className="text-red h-[48px] max-sm:h-[48px] px-[20px] max-sm:px-4 border-[1px] border-red-100 flex items-center justify-center bg-red09 hover:bg-red23 rounded-[27px]"
        >
          <WalletIcon className="mr-3" />
          Connect wallet
        </button>
      ) : (
        <button
          onClick={() => disconnect()}
          className="text-red h-[48px] max-sm:h-[48px] px-[20px] max-sm:px-4 border-[1px] border-red-100 flex items-center justify-center bg-red09 hover:bg-red23 rounded-[27px]"
        >
          <WalletIcon className="mr-3" />
          <div>{ensName ? `${ensName} (${address})` : getEllipsisTxt(address)}</div>
        </button>
      )}
    </header>
  );
};
