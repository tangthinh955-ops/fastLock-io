import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { LivestreamService } from './livestream.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';
import { LivestreamGateway } from './livestream.gateway';

@Controller('livestreams')
export class LivestreamController {
    constructor(
        private readonly livestreamService: LivestreamService,
        private readonly livestreamGateway: LivestreamGateway,
    ) { }

    @Post()
    async createStream(@Body() dto: CreateLivestreamDto) {
        const stream = await this.livestreamService.createStream(dto);
        this.livestreamGateway.notifyStreamStarted(stream);
        return stream;
    }

    @Patch(':id/end')
    async endStream(@Param('id') id: string) {
        const stream = await this.livestreamService.endStream(id);
        this.livestreamGateway.notifyStreamEnded(id);
        return stream;
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
