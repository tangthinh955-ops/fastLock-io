import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { LivestreamService } from './livestream.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';

@Controller('livestreams')
export class LivestreamController {
    constructor(private readonly livestreamService: LivestreamService) { }

    @Post()
    async createStream(@Body() dto: CreateLivestreamDto) {
        return await this.livestreamService.createStream(dto);
    }

    @Patch(':id/end')
    async endStream(@Param('id') id: string) {
        return await this.livestreamService.endStream(id);
    }

    @Get('active')
    async getAllActiveStreams() {
        return await this.livestreamService.getAllActiveStreams();
    }

    @Get('active/seller/:sellerId')
    async getActiveStreamBySeller(@Param('sellerId') sellerId: string) {
        return await this.livestreamService.getActiveStreamBySeller(sellerId);
    }

    @Get(':id')
    async getStreamById(@Param('id') id: string) {
        return await this.livestreamService.getStreamById(id);
    }
}
