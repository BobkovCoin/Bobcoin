import { Address, address, toNano } from "ton-core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton-community/blueprint";

export async function run(provider: NetworkProvider){
  const codeCell = await compile("MainContract");

  const myContract = MainContract.createFromConfig({
    number: 0,
    address: address("0QDu1tbkV_LsOHew8akHM4ycOeoH1mg-6UktbpMZobRyaicS"),
    owner_address: address("0QDu1tbkV_LsOHew8akHM4ycOeoH1mg-6UktbpMZobRyaicS"),
    },
    codeCell
  );
  
  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.05"));

  await provider.waitForDeploy(myContract.address);
}