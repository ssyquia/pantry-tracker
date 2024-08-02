## Overview
The Pantry Tracker is a web-based tool designed to assist users in efficiently managing their pantry items. It enables users to add, update, delete, and search for specific items in their pantry.

## Core Features
1. Add Items: Users can input new pantry items by providing a name OR optionally uploading an image. Uploaded images are automatically classified using the Clarifai API.
2. Delete Items: Users can remove items from their pantry, which updates the list accordingly.
3. Search Items: Users can filter pantry items by their names.

## Technologies Used
- Frontend: React, Material UI, Next.js
- Backend: Firebase (Firestore, Storage)
- Image Classification API: Clarifai API

## Deployment:
- Vercel: Used for deploying the Next.js application in a production environment.

## Features
- Responsive Design: Adjusts to different screen sizes.
- File Handling: Users can upload images, which are managed and processed using Firebase Storage and the Clarifai API.
- Image Classification: Once an image is classified by the Food Recognition model via the Clarifai API, the item name is automatically added.

## Future Plans
- User Authentication: To manage personalized data and allow multiple users to manage their own pantries.
- Integration with Shopping Lists: Enable users to create shopping lists based on missing items or pantry requirements.





