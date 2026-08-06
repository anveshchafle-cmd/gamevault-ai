// Message templates — kept friendly and honest. No fake urgency, no
// guilt-tripping, no dark patterns. Every claim in these messages should
// be true (real offer, real deadline, real stat) when wired up to real data.

export function churnRecoveryMessage(
    customerName: string,
    favoriteGame: string | null,
    daysInactive: number
  ): string {
    const gamePart = favoriteGame ? ` on ${favoriteGame}` : "";
    return `Hey ${customerName}! It's been ${daysInactive} days since your last session${gamePart}. Your station's ready whenever you are — come by this week and get 30 mins free on us.`;
  }
  
  export function milestoneMessage(
    customerName: string,
    milestoneDescription: string
  ): string {
    return `Congrats ${customerName}! ${milestoneDescription} 🎉 Thanks for being one of our regulars — see you soon.`;
  }
  
  export function fomoFlashMessage(
    customerName: string,
    offerDescription: string,
    expiryInfo: string
  ): string {
    return `Hey ${customerName}, quick heads up: ${offerDescription}. ${expiryInfo}`;
  }
  
  export function referralMessage(
    customerName: string,
    referredFriendName: string,
    hoursEarned: number
  ): string {
    return `Hey ${customerName}, ${referredFriendName} just visited using your referral! You've earned ${hoursEarned} free hour(s). Thanks for spreading the word.`;
  }
  