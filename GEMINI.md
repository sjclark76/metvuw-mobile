# Metvuw Mobile Project

This document provides an overview of the Metvuw Mobile project to help AI assistants understand its structure and purpose.

## Initial Setup

At the beginning of each session, you **MUST** review the `repomix-output.xml` file. This file contains a complete and up-to-date representation of the entire repository and is essential for understanding the project context.

## Overview

This project is a mobile-friendly web application for viewing weather information, primarily from Metvuw. It is built with Next.js and TypeScript, and it scrapes, processes, and displays weather images.

**Important:** When working with this project, you should always refer to the `repomix-output.xml` file as it contains a summarized detail of the entire project. This file provides the most comprehensive context for any task.

## Key Technologies

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Backend & APIs:** Next.js API Routes
*   **Background Jobs:** Inngest
*   **Database & Storage:** Supabase (Postgres and Storage)
*   **Testing:**
    *   E2E: Playwright
    *   Unit/Component: Jest and Vitest
    *   Monitoring: Checkly
*   **Deployment:** Vercel

## Project Structure

The project follows a structure typical for a Next.js application:

*   `src/app`: Contains the core application, including pages, API routes, and layouts.
    *   `api/scrape`: Endpoints for scraping weather data.
    *   `api/inngest`: Endpoint for managing Inngest background jobs.
    *   `regions/[name]`: Page for displaying regional weather forecasts.
    *   `radar/[code]`: Page for displaying weather radar.
    *   `satellite`: Page for displaying satellite imagery.
    *   `upperair`: Page for displaying upper air data.
*   `src/components`: Contains reusable React components used throughout the application.
*   `src/inngest`: Defines Inngest functions and cron jobs for periodic data scraping.
*   `src/shared`: Contains shared utilities, types, and helpers.
    *   `helpers/v2/screenScraper`: Logic for scraping images from the source website.
    *   `helpers/v2/imageStorage`: Functions for managing image uploads and removals from Supabase Storage.
*   `supabase`: Configuration and migration files for the Supabase database.
*   `e2e`: End-to-end tests written with Playwright.
*   `__checks__`: Checkly configuration for synthetic monitoring and API checks.

## Core Functionality

The application's primary function is to scrape weather images from an external source, process them, and display them in a user-friendly, mobile-first interface.

*   **Scraping:** The scraping logic is located in `src/shared/helpers/v2/screenScraper`.
*   **Background Jobs:** Inngest cron jobs in `src/inngest/cronFunctions` trigger the scraping process periodically to keep the data up-to-date.
*   **Image Processing:** Scraped images are compressed and optimized before being stored.
*   **Storage:** Processed images are stored in Supabase Storage.
*   **Data Display:** The frontend retrieves the images from Supabase Storage and displays them on the relevant pages.

The application handles several types of weather data:
*   Regional rain forecasts
*   Radar imagery
*   Satellite imagery
*   Upper air soundings

## Development and Testing

*   **Running Tests:**
    *   Unit/Component Tests: `npm test`
    *   E2E Tests: `npx playwright test` (requires a running instance of the application, with the base URL set via the `PLAYWRIGHT_TEST_BASE_URL` environment variable).
*   **Building the Project:**
    *   `npm run build`