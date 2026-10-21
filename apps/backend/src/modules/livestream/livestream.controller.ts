import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LivestreamService } from './livestream.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';
import { LivestreamGateway } from './livestream.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('livestreams')
export class LivestreamController {
    constructor(
        private readonly livestreamService: LivestreamService,
        private readonly livestreamGateway: LivestreamGateway,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async createStream(
        @CurrentUser('userId') sellerId: string,
        @Body() dto: CreateLivestreamDto,
    ) {
        const stream = await this.livestreamService.createStream(sellerId, dto);
        this.livestreamGateway.notifyStreamStarted(stream);
        return stream;
    }

    @Patch(':id/end')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async endStream(
        @Param('id') id: string,
        @CurrentUser('userId') sellerId: string,
    ) {
        const stream = await this.livestreamService.endStream(id, sellerId);
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
