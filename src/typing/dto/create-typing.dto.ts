export class CreateTypingDto {
  userId?: string;
  targetText: string;
  typedText: string;
  startTime: number;
  endTime: number;
}
