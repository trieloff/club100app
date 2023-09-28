export function verifyComment(body) {
  return body.includes('PERFORMANCE-100');
}

export async function verify(
  url,
  verificationCode,
  github_token,
  { onsuccess, onreject, onerror },
) {
  const isGithubPR = url.match(
    /^https:\/\/github.com\/([\w-]+)\/([\w-]+)\/pull\/(\d+)$/,
  );

  if (!isGithubPR) {
    return onreject('Wrong link buddy, try again 😢');
  } else if (isGithubPR) {
    // eslint-disable-next-line no-unused-vars
    const [_, owner, repo, pull_number] = isGithubPR;

    try {
      const prResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
        {
          headers: {
            // Authorization: `token ${github_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (!prResponse.ok) {
        console.error(
          'Unable to fetch PR data from GitHub.',
          prResponse.url,
          prResponse.status,
          await prResponse.json(),
        );
        return onreject(
          'I do not have access to that PR and can only verify PRs in public repos. 🔑',
        );
      }
      const prData = await prResponse.json();

      const prAuthorId = prData.user.id;
      if (!prData.merged) {
        return onreject('This PR has not been merged. 😔');
      } else if (prData.merged) {
        console.log('PR merged, checking for verification comment');
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`,
          {
            headers: {
              // Authorization: `token ${github_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );
        if (!commentsResponse.ok) {
          console.error(
            'Unable to fetch PR comments from GitHub.',
            commentsResponse.url,
            commentsResponse.status,
            await commentsResponse.json(),
          );
          return onerror('An error occurred while checking your PR. 😭');
        }
        const commentsData = await commentsResponse.json();

        const verificationComment = commentsData.find((comment) => {
          return comment.body.includes(verificationCode);
        });

        if (!verificationComment) {
          return onreject(
            'I could not verify that PR. Make sure to include the verification code in the PR comments. 😢',
          );
        } else if (verificationComment.user.id !== prAuthorId) {
          return onreject(
            'I could not verify that PR. The verification code comment was not commented by the PR author. Are you sure it is really you? 😢',
          );
        } else if (
          verificationComment &&
          verificationComment.user.id === prAuthorId
        ) {
          // searching for the performance score comment
          const performance100Comment = commentsData
            .filter(({ user }) => user.id === 43241697) // helix bot
            .find(({ body }) => verifyComment(body));

          if (!performance100Comment) {
            return onreject(
              "Sorry, couldn't find a performance score of 100. Ask in #aem-chat for help",
            );
          } else if (performance100Comment) {
            return onsuccess({
              prData,
              performance100Comment,
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      return onerror('An error occurred while checking your PR. 😭');
    }
  }
}
