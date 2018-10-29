import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { Aurum } from '../../shared/aurum.model';
import { DataStorageService } from '../../shared/data-storage.service';
import { LineModel, Markup } from '../../shared/line.model';

@Component({
  selector: 'app-viz',
  templateUrl: './viz.component.html',
  styleUrls: ['./viz.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VizComponent implements OnInit {

  private storedData: Aurum;
  private storedData2: Aurum;

  isComparison: boolean;
  firstWebsiteName: string;
  secondWebsiteName: string;

  @ViewChild('dataContainer') dataContainer: ElementRef;
  @ViewChild('dataContainer2') dataContainer2: ElementRef;

  constructor(private dataStorage: DataStorageService) { }

  /**
   * Here we subscribe to the data storage service which is essential in order to
   * retrieve the data upon arrival.
   */
  ngOnInit() {
    // Check if we are in comparison mode or not
    this.isComparison = this.dataStorage.isComparsion;

    // TODO: Add maybe take(1) as we only need the values once anc can unsubscribe later
    this.dataStorage.currentData.subscribe((data) => {
      console.log('triggered first data storage... observable');

      this.storedData = data;
      this.renderText(this.storedData);
    });

    // We need to subscribe only if its a comparison
    if (this.isComparison) {
      this.dataStorage.currentData2.subscribe((data) => {
        console.log('triggered second data storage... observable');

        this.storedData2 = data;
        this.renderSecondText(this.storedData2);
      });
    }
  }

  /**
   * This method is currently used to render just the received data and show it on the screen.
   * @param data to show to the user
   */
  private renderText(data: Aurum) {
    console.log('FROM component | Inside renderText() function (ONE INPUT).');

    this.firstWebsiteName = data.link;
    const stringToPrint = data.markupString.map(v => {
      if (v === '\n') {
        return v;
      } else {
        return '<span class=\'js-detect-wrap\'>' + v + '</span> ';
      }
    }).join('');
    this.dataContainer.nativeElement.innerHTML = stringToPrint;

    // based on https://github.com/xdamman/js-line-wrap-detector/blob/master/src/lineWrapDetector.js
    const spans = this.dataContainer.nativeElement.getElementsByClassName('js-detect-wrap');

    let lastOffset = 0, line = [], l = 0;
    const lines = [];
    const mLines = [];

    for (let i = 0; i < spans.length; i++) {
      const offset = spans[i].offsetTop + spans[i].getBoundingClientRect().height;
      if (offset === lastOffset) {
        line.push(spans[i]);
      } else {
        if (line.length > 0) {
          lines[l++] = line;

          mLines.push(this.domToModel(lastOffset, line));
        }

        line = [spans[i]];
      }
      lastOffset = offset;
    }
    lines.push(line);
    mLines.push(this.domToModel(lastOffset, line));

    console.log(mLines.length + ' lines');
    console.log(mLines);
  }

  private domToModel(lastOffset: number, line: Array<HTMLBaseElement>): LineModel {
    return new LineModel(lastOffset,
      // markupText : remove detect-wrap spans & join
      line.map((v) =>  v.innerHTML).join(' '),
      // markup: one "colored" block for each token
      line.map((v) => {
        const r = v.getBoundingClientRect();
        let cat = 'x-none';
        if (v.innerHTML.startsWith('<span')) {
          cat = v.innerHTML.replace(/<span class=(?:\"|\')([a-z]*)(?:\"|\')>.*/, '$1');
        }
        return {start: r.left, end: r.right, class: cat};
      }));
  }

  /**
   * This method is only used if we are in comparison mode.
   * @param data to show in the second input
   */
  private renderSecondText(data: Aurum) {
    console.log('FROM component | Inside renderSecondText() function (TWO INPUTS)');

    this.secondWebsiteName = data.link;
    const stringToPrint = data.markupString.join(' ');
    this.dataContainer2.nativeElement.innerHTML = stringToPrint;
  }
}
