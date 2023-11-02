import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { publicProvider } from 'wagmi/providers/public'
import { mainnet, goerli } from 'wagmi/chains'
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { SendTransferForm } from "./containers/SendTransferForm";
import { StakeVanishForm } from "./containers/StakeVanishForm/StakeVanishForm";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SendTransferForm />,
  },
  {
    path: "/stake",
    element: <StakeVanishForm />,
  },
]);

const { chains, publicClient } = configureChains(
  [mainnet, goerli],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient,
});

function App() {
  return (
    <>
      <WagmiConfig config={config}>
        <Header />
        <div className="mb-[30px]" />
        <div className="my-auto">
          <RouterProvider router={router} />
          {/* <SendTransferForm /> */}
          {/* <StakeVanishForm /> */}
        </div>
        <div className="mb-[48px]" />
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          pauseOnHover
          theme="dark"
        />
      </WagmiConfig>
    </>
  );
}

export default App;
