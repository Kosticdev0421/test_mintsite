import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import axios from "axios";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import './app.css'
import img from "./img.png"

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  padding: 18px;
  font-weight: bold;
  color: var(--secondary-text);
  width: 100px;
  cursor: pointer;
  box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;


export const ResponsiveWrapper = styled.div`
  width: 400px;
  @media (min-width: 400px) {
    flex-direction: row;
  }
`;

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  background-color: var(--accent);
  border-radius: 100%;
  width: 200px;
  @media (min-width: 1000px) {
    width: 250px;
  }
  @media (min-width: 1000px) {
    width: 300px;
  }
  transition: width 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [claimingNft1, setClaimingNft1] = useState(false);
  const [feedback, setFeedback] = useState(`Claim up to 2 TESTS!`);
  const [mintAmount, setMintAmount] = useState(1);
  const [mytokens, setMyTokens] = useState([]);
  const [tokenDatas, setTokenDatas] = useState([]);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Purchasing your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .publicSaleMint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("There was a problem. Try again!");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `Congratz, Wait for reveal!`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
        dispatch(connect());
      });
  };

  const refund = (id) => {
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalGasLimit = String(gasLimit * 1);
    let refundamount = [];
    refundamount[0] = id;
    setClaimingNft1(true);
    blockchain.smartContract.methods
      .refund(refundamount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("There was a problem. Try again!");
        setClaimingNft1(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setClaimingNft1(false);
        dispatch(fetchData(blockchain.account));
        dispatch(connect());
      });

  }

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 2) {
      newMintAmount = 2;
    }
    setMintAmount(newMintAmount);
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getTokenId = async () => {
    if (blockchain.smartContract != null) {
      let receipt = await blockchain.smartContract.methods.getTokenIdsByAddress(blockchain.account).call();
      setMyTokens(receipt);
    }
  }

  const getiamgeURL = async () => {
    if (blockchain.smartContract != null && mytokens.length > 0) {
      let tokenDatas_temp = []
      for (let i = 0; i < mytokens.length; i++) {
        const tokenURI = await blockchain.smartContract.methods.tokenURI(mytokens[i]).call();
        const imageUrl = (await axios.get(tokenURI)).data?.image;
        const usefulURL = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        let tokenData = {};
        tokenData.id = mytokens[i];
        tokenData.image = usefulURL;
        tokenDatas_temp[tokenDatas_temp.length] = tokenData
      }
      setTokenDatas(tokenDatas_temp)
    }
  }

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getiamgeURL();
  }, [mytokens])

  useEffect(() => {
    getTokenId();
    getData();
  }, [blockchain.account]);

  return (
    <s.Screen
      image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
    >
      <div className="navebar">
        <div className="logo"></div>
        <div className="menubar">
          <ul className="button">
            <li onClick={() => { dispatch(connect()) }}>Connect</li>
            <li><a href="#about">About</a></li>
            <li><a href="#refund">Refund</a></li>
          </ul>
        </div>
      </div>
      <s.Container
        flex={1}
        jc={"center"}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.Container
            flex={1}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              borderRadius: 24,
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
            }}
          >
            <s.TextTitle
              style={{
                textAlign: "center",
                fontSize: 50,
                color: "var(--accent-text)",
              }}
            >
              {data.totalSupply} / {CONFIG.MAX_SUPPLY}
            </s.TextTitle>
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "var(--primary-text)",
              }}
            >
              <StyledLink target={"_blank"} href={CONFIG.SCAN_LINK}>
                {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
              </StyledLink>
            </s.TextDescription>
            <s.SpacerSmall />
            {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  The sale has ended.
                </s.TextTitle>
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  You can still find {CONFIG.NFT_NAME} on
                </s.TextDescription>
                <s.SpacerSmall />
                <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                  {CONFIG.MARKETPLACE}
                </StyledLink>
              </>
            ) : (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  Price: {CONFIG.DISPLAY_COST}{" "}
                  {CONFIG.NETWORK.SYMBOL}.
                </s.TextTitle>
                {blockchain.account === "" ||
                  blockchain.smartContract === null ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                    </s.TextDescription>
                    <s.SpacerSmall />
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        getData();
                      }}
                    >
                      BUY
                    </StyledButton>
                    <s.SpacerSmall />
                    {blockchain.errorMsg !== "" ? (
                      <>
                        <s.SpacerSmall />
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          {blockchain.errorMsg}
                        </s.TextDescription>
                      </>
                    ) : null}
                  </s.Container>
                ) : (
                  <>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {feedback}
                    </s.TextDescription>
                    <s.SpacerMedium />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledRoundButton
                        style={{ lineHeight: 0.4 }}
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          decrementMintAmount();
                        }}
                      >
                        -
                      </StyledRoundButton>
                      <s.SpacerMedium />
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          color: "var(--accent-text)",
                        }}
                      >
                        {mintAmount}
                      </s.TextDescription>
                      <s.SpacerMedium />
                      <StyledRoundButton
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          incrementMintAmount();
                        }}
                      >
                        +
                      </StyledRoundButton>
                    </s.Container>
                    <s.SpacerSmall />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledButton
                        disabled={claimingNft ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          claimNFTs();
                          getData();
                        }}
                      >
                        {claimingNft ? "Waiting.." : "BUY"}
                      </StyledButton>
                    </s.Container>
                    <s.SpacerSmall />
                  </>
                )}
              </>
            )}
          </s.Container>
        </ResponsiveWrapper>
      </s.Container>
      <div className="about" id="about">
        <h1>About</h1>
        <div className="text">
          <h1>Text</h1>
          <h1>Text</h1>
          <h1>Text</h1>
        </div>
      </div>
      <s.Container
        flex={1}
        jc={"center"}
        ai={"center"}
        style={{ padding: 24, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/bg.png" : null}
      >
        <div className="about1">
          <h1>Refund</h1>
        </div>
        <ResponsiveWrapper flex={1} style={{ padding: 24 }} test>
          <s.Container
            flex={1}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              borderRadius: 24,
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
            }}
          >
            <s.SpacerSmall />
            <>
              {blockchain.account === "" ||
                blockchain.smartContract === null || mytokens.length == 0 ? (
                <>
                  <p className="desc">No NFT</p>
                  <s.SpacerSmall />
                </>
              ) : (
                <>
                  {
                    tokenDatas.map((index) => (
                        <>
                          <s.Container ai={"center"} jc={"center"} fd={"row"}>
                            <s.SpacerMedium />
                            {

                              <img src={index.image} key={index} alt="" />

                            }
                            <s.SpacerMedium />
                          </s.Container>
                          <s.SpacerMedium />
                          <s.Container ai={"center"} jc={"center"} fd={"row"}>
                            <h1 className="desc">NFT {index.id}</h1>
                          </s.Container>
                          <s.SpacerMedium />
                          <s.Container ai={"center"} jc={"center"} fd={"row"}>
                            <StyledButton
                              disabled={claimingNft1 ? 1 : 0}
                              onClick={(e) => {
                                e.preventDefault();
                                refund(index.id);
                              }}
                            >
                              {claimingNft1 ? "Waiting.." : "REFUND"}
                            </StyledButton>
                          </s.Container>
                          <s.SpacerMedium />
                        </>
                      ))
                  }
                </>
              )}
            </>
          </s.Container>
        </ResponsiveWrapper>
      </s.Container>
    </s.Screen>
  );
}

export default App;