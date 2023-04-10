import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
// import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScraperService {
  // constructor(private readonly prismaService: PrismaService) {}

  async scrape() {
    const baseUrl = 'https://books.toscrape.com/';
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });
    const page = await browser.newPage();

    // Navigate to the first page of book listings
    let currentPage = 1;
    let hasNextPage = true;
    let bookData = [];

    while (hasNextPage) {
      const url = `${baseUrl}catalogue/page-${currentPage}.html`;
      await page.goto(url);

      // Use Puppeteer to scrape the website
      const pageBookData = await page.evaluate((url) => {
        const bookPods = Array.from(document.querySelectorAll('.product_pod'));
        const data = bookPods.map((book: any) => ({
          title: book.querySelector('h3 a').getAttribute('title'),
          rating: book.querySelector('.star-rating').classList[1],
          price: book.querySelector('.product_price .price_color').innerHTML,
          imgSrc: book.querySelector('img').getAttribute('src'),
          stock: book.querySelector('.availability').textContent.trim(),
        }));
        return data;
      },url);

      bookData = bookData.concat(pageBookData);

      // Check if there is a "next" button on the page
      const nextButton = await page.$('.next > a');
      if (!nextButton) {
        hasNextPage = false;
      } else {
        // Click the "next" button and wait for the next page to load
        await Promise.all([
          page.click('.next > a'),
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
        currentPage++;
      }
    }

    console.log(bookData);
    // await browser.close();
  }
}
