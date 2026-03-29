# Contributing to CampusBites

First off, thank you for considering contributing to **CampusBites**! It's people like you that make CampusBites such a great tool for smart campus dining.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/Pxrvn07/CampusBites/issues) to see if someone else has already created a ticket. If not, go ahead and create one!

## Fork & create a branch

If this is something you think you can fix, then fork CampusBites and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-stripe-support
```

## Implement your fix or feature

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first :smile_cat:

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with CampusBites' main branch:

```sh
git remote add upstream https://github.com/Pxrvn07/CampusBites.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of main, and push it!

```sh
git checkout 325-add-stripe-support
git rebase main
git push --set-upstream origin 325-add-stripe-support
```

Finally, go to GitHub and make a Pull Request! :tada:

## Code Guidelines

- **Frontend**: We use Next.js, React and Tailwind CSS. Ensure all components are responsive and accessible.
- **Backend**: We use Node.js and Express. Ensure that your code handles errors gracefully and adheres to RESTful conventions where appropriate.

## Reporting Bugs

Please include as much detail as possible in your bug reports. Helpful items include:
- A description of the issue.
- Steps to reproduce.
- Expected behavior.
- Screenshots or screen recordings, if applicable.

Thanks for your contribution!
