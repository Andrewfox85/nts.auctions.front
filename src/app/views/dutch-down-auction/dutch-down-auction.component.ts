import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DutchDownAuctionStore } from './store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dutch-down-auction',
  imports: [RouterModule],
  standalone: true,
  templateUrl: './dutch-down-auction.component.html',
  styleUrl: './dutch-down-auction.component.scss',
  providers: [DutchDownAuctionStore],
})
export class DutchDownAuctionComponent {
  private readonly store = inject(DutchDownAuctionStore);
}
