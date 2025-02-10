import { Controller, Post, Body } from '@nestjs/common';
import { TypingService, TypingResult } from './typing.service';
import { CreateTypingDto } from './dto/create-typing.dto';

@Controller('typing')
export class TypingController {
  constructor(private readonly typingService: TypingService) {}

  @Post('finish')
  finishTyping(@Body() createTypingDto: CreateTypingDto): TypingResult {
    return this.typingService.finishTyping(createTypingDto);
  }
}
