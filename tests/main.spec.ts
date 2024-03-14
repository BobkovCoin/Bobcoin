import { Cell, toNano } from "ton-core";
import { hex } from "../build/main.compiled.json";
import { Blockchain, SandboxContract, Treasury, TreasuryContract } from "@ton-community/sandbox";
import { MainContract, mainContractConfigToCell } from "../wrappers/MainContract";
import "@ton-community/test-utils";
import { compile } from "@ton-community/blueprint";

describe("main.fc contract tests", () => {

  let blockchain: Blockchain;
  let myContract: SandboxContract<MainContract>;
  let initWallet: SandboxContract<TreasuryContract>;
  let ownerWallet: SandboxContract<TreasuryContract>;
  let codeCell: Cell;

  beforeAll( async () => {
    codeCell = await compile("MainContract")
  });

  beforeEach(async () => {

    blockchain = await Blockchain.create();
    initWallet = await blockchain.treasury("initWallet");
    ownerWallet = await blockchain.treasury("ownerWallet");

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(
        {
          number: 0,
          address: initWallet.address,
          owner_address: ownerWallet.address,
        },
        codeCell
      )
    )
  });


  it("Should successfully increase counter in contract and get the proper most recent sender address", async () => {

    const senderWallet = await blockchain.treasury("sender");

    const sentMessageResult = await myContract.sendIcrement(
      senderWallet.getSender(),
      toNano("0.05"),
      1
    );

    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();

    expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
    expect(data.number).toEqual(1);
  });

  it("Succesfully deposits funds", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendDeposit(
      senderWallet.getSender(), 
      toNano("5")
    );
    
    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const BalanceRequest = await myContract.getBalance();

    expect(BalanceRequest.balance).toBeGreaterThan(toNano("4.99"));

  });

  it("Should return funds as no command sent", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendNoCodeDeposit(
      senderWallet.getSender(), 
      toNano("5")
    );
    
    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
    });

    const BalanceRequest = await myContract.getBalance();

    expect(BalanceRequest.balance).toEqual(0);
  });

  it("Succesfully withdraws funds on behalf of owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano("0.05"),
      toNano(1),
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      success: true,
      value:toNano(1),
    });

  });

  it("Fails to withdraw funds on behalf of non-owner", async () => {
    const senderWallet = await blockchain.treasury("sender");
    const yetAnotherWallet = await blockchain.treasury("nonowner");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      yetAnotherWallet.getSender(),
      toNano("0.05"),
      toNano(1),
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: yetAnotherWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 103,
    });
  });

  it("Fails to withdraw funds because lack of balance", async () => {
    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(
      ownerWallet.getSender(),
      toNano("0.05"),
      toNano(1),
    );

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 104,
    });

  });
});