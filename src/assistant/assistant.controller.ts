import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssistantService } from './assistant.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Controller('assistant')
@UseGuards(AuthGuard('jwt'))
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async chat(
    @Request() req,
    @Body() chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    return this.assistantService.chat(req.user.id, chatRequest);
  }
}
