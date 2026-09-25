/** Ticket numbers follow the creator's numbered replies in the supplied Threads screenshots. */
export const SOCIAL_FROG_RAFFLE_ENTRIES = [
  { number: 1, account: "a2••••214", comment: "好期待上線的那一天！！！希望可以抽到我🤩🤩🤩" },
  { number: 2, account: "wl••••lie", comment: "好期待，想要貼紙" },
  { number: 3, account: "st••••game", comment: "很讚耶👍" },
  { number: 4, account: "wa••••wed", comment: "想要更多狗勾貼紙🥺" },
  { number: 5, account: "ti••••023", comment: "希望可以抽到😍😍😍" },
  { number: 6, account: "cw••••997", comment: "抽！" },
  { number: 7, account: "be••••214", comment: "好可愛，感覺遊戲很治癒" },
  { number: 8, account: "lu••••882", comment: "祝順利！" },
  { number: 9, account: "an••••920", comment: "抽" },
  { number: 10, account: "dk••••ter", comment: "甘巴！" },
  { number: 11, account: "ya••••02", comment: "祝你們參展順利～" },
  { number: 12, account: "cs••••30", comment: "好期待上線的那一天，等了好久😭😭" },
  { number: 13, account: "ki••••213", comment: "好可愛的一款遊戲很療癒 希望上線的那一天趕快到來🥳" },
  { number: 14, account: "li•••••jj", comment: "抽抽可愛明信片貼紙😳" },
  { number: 15, account: "ly••••811", comment: "小日獸很可愛！祝福你們順利～" },
  { number: 16, account: "ia••••las", comment: "恭喜!!!! 預祝一切順利!!! 🍀🍀🍀" },
  { number: 17, account: "ja••••122", comment: "立刻抽😳" },
  { number: 18, account: "sh••••ang", comment: "可愛可愛，抽抽" },
  { number: 19, account: "t8••••22", comment: "小日獸真的好萌～祝福你們一切順利～～～～" },
] as const;

export function frogRaffleEntry(number: number) {
  return SOCIAL_FROG_RAFFLE_ENTRIES[number - 1];
}
