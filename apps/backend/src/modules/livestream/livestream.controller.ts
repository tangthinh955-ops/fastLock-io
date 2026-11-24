import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LivestreamService } from './livestream.service';
import { CreateLivestreamDto } from './dto/create-livestream.dto';
import { LivestreamGateway } from './livestream.gateway';
import { LivekitTokenService, type LivekitTokenUser } from './livekit-token.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('livestreams')
export class LivestreamController {
    constructor(
        private readonly livestreamService: LivestreamService,
        private readonly livestreamGateway: LivestreamGateway,
        private readonly livekitTokenService: LivekitTokenService,
    ) { }

    @Post(':id/token')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER, Role.BUYER)
    async createLivekitToken(
        @Param('id') id: string,
        @CurrentUser() user: LivekitTokenUser,
    ) {
        return await this.livekitTokenService.createRoomToken(id, user);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async createStream(
        @CurrentUser('userId') sellerId: string,
        @Body() dto: CreateLivestreamDto,
    ) {
        const endedStreamIds =
            await this.livestreamService.endActiveStreamsForSeller(sellerId);
        const stream = await this.livestreamService.createStream(sellerId, dto);
        for (const oldId of endedStreamIds) {
            this.livestreamGateway.notifyStreamEnded(oldId);
        }
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
    @UseGuards(JwtAuthGuard)
    async getAllActiveStreams() {
        return await this.livestreamService.getAllActiveStreams();
    }

    @Get('shops')
    @UseGuards(JwtAuthGuard)
    async getShopsWithLiveStatus() {
        return await this.livestreamService.getShopsWithLiveStatus();
    }

    @Get('active/seller/:sellerId')
    @UseGuards(JwtAuthGuard)
    async getActiveStreamBySeller(@Param('sellerId') sellerId: string) {
        return await this.livestreamService.getActiveStreamBySeller(sellerId);
    }

    @Get(':id/products')
    @UseGuards(JwtAuthGuard)
    async getLiveProducts(@Param('id') id: string) {
        return await this.livestreamService.getLiveProducts(id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getStreamById(@Param('id') id: string) {
        return await this.livestreamService.getStreamById(id);
    }
}
