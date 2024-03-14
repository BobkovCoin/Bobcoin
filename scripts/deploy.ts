import { Address, address, toNano } from "ton-core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton-community/blueprint";

export async function run(provider: NetworkProvider){
  const codeCell = await compile("MainContract");

  const myContract = MainContract.createFromConfig({
    number: 0,
    address: address("UQAXBTTv196DUEc0K2MQvPvBq6HlNIdfmlKOmF2QLaPqtYmd"),
    owner_address: address("UQAXBTTv196DUEc0K2MQvPvBq6HlNIdfmlKOmF2QLaPqtYmd"),
    },
    codeCell
  );
  
  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.05"));

  await provider.waitForDeploy(myContract.address);
}