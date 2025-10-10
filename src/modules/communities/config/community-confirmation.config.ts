export class CommunityConfirmationConfig {
  static readonly requiredMembersCount = 2;
  static readonly confirmationHours = 24;
  
  static calculateConfirmationDeadline(): Date {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + this.confirmationHours);
    return deadline;
  }
}