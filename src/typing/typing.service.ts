import { Injectable } from '@nestjs/common';
import { CreateTypingDto } from './dto/create-typing.dto';

export interface SessionResult {
  durationMs: number;
  cpm: number;
  accuracy: number;
}

export interface TypingResult {
  current: {
    '진행시간': string;
    '현재타수': number;
    '현재정확도': number;
  };
  record: {
    '최고타수': number;
    '평균타수': number;
    '전체평균정확도': number;
  };
}

@Injectable()
export class TypingService {
  private sessions: SessionResult[] = [];

  finishTyping(createTypingDto: CreateTypingDto): TypingResult {
    console.log('Received typing data:', createTypingDto);
    try {
      const { targetText, typedText, startTime, endTime } = createTypingDto;

      if (targetText == null || typedText == null || startTime == null || endTime == null) {
        throw new Error('createTypingDto에 필수 필드가 누락되었습니다.');
      }
      if (typeof startTime !== 'number' || typeof endTime !== 'number') {
        throw new Error('startTime과 endTime은 밀리초 단위의 숫자여야 합니다.');
      }

      const normalizedTarget = targetText.normalize('NFC');
      const normalizedTyped = typedText.normalize('NFC');

      const elapsedMs = endTime - startTime;
      if (elapsedMs < 0) {
        throw new Error('endTime은 startTime보다 커야 합니다.');
      }
      const elapsedSeconds = elapsedMs / 1000;

      const totalTyped = normalizedTyped.replace(/\s/g, '').length;
      const grossCPM = elapsedSeconds > 0 ? (totalTyped * 60) / elapsedSeconds : 0;

      const correctChars = this.computeCorrectChars(normalizedTarget, normalizedTyped);
      const totalTargetChars = normalizedTarget.replace(/\s/g, '').length;
      const rawAccuracy = totalTargetChars > 0 ? (correctChars / totalTargetChars) * 100 : 100;
      const accuracy = Math.min(Number(rawAccuracy.toFixed(2)), 100);

      const session: SessionResult = {
        durationMs: elapsedMs,
        cpm: Number(grossCPM.toFixed(2)),
        accuracy: accuracy,
      };

      this.sessions.push(session);
      console.log('Current session result:', session);

      const bestCPM = Math.max(...this.sessions.map((s) => s.cpm));
      const avgCPM = this.sessions.reduce((sum, s) => sum + s.cpm, 0) / this.sessions.length;
      const avgAccuracy = this.sessions.reduce((sum, s) => sum + s.accuracy, 0) / this.sessions.length;

      const result: TypingResult = {
        current: {
          '진행시간': this.formatDuration(elapsedMs),
          '현재타수': Number(grossCPM.toFixed(2)),
          '현재정확도': accuracy,
        },
        record: {
          '최고타수': bestCPM,
          '평균타수': Number(avgCPM.toFixed(2)),
          '전체평균정확도': Number(avgAccuracy.toFixed(2)),
        },
      };

      console.log('Returning result:', result);
      return result;
    } catch (error) {
      console.error('Error in finishTyping:', error);
      throw error;
    }
  }

  private computeCorrectChars(target: string, typed: string): number {
    let count = 0;
    const len = Math.min(target.length, typed.length);
    for (let i = 0; i < len; i++) {
      if (target[i] === typed[i]) {
        count++;
      }
    }
    return count;
  }

  private formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
