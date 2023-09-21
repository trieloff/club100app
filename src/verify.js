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
    onerror('Wrong link buddy, try again 😢');
    return;
  } else if (isGithubPR) {
    // eslint-disable-next-line no-unused-vars
    const [_, owner, repo, pull_number] = isGithubPR;

    try {
      const prResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
        {
          headers: {
            Authorization: `token ${github_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (!prResponse.ok) {
        onerror('I could not find that PR. 😢');
        return;
      }
      const prData = await prResponse.json();

      const prAuthorId = prData.user.id;

      if (!prData.merged) {
        onreject('This PR has not been merged. 😔');
        return;
      } else if (prData.merged) {
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`,
          {
            headers: {
              Authorization: `token ${github_token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );
        if (!commentsResponse.ok) {
          onerror('An error occurred while checking your PR. 😭');
          return;
        }
        const commentsData = await commentsResponse.json();

        const verificationComment = commentsData.find((comment) => {
          return comment.body.includes(verificationCode);
        });

        if (!verificationComment) {
          onreject(
            'I could not verify that PR. Make sure to include the verification code in the PR comments. 😢',
          );
        } else if (verificationComment.user.id !== prAuthorId) {
          onreject(
            'I could not verify that PR. The verification code comment was not commented by the PR author. Are you sure it is really you? 😢',
          );
        } else if (
          verificationComment &&
          verificationComment.user.id === prAuthorId
        ) {
          // searching for the performance score comment
          const performance100Comment = commentsData.find((comment) => {
            return (
              comment.user.id === 43241697 && // helix bot
              (comment.body.includes('PERFORMANCE-97') || // need to check with Johan why 97 is ok now.
                comment.body.includes('SCORE-100'))
            );
          });

          if (!performance100Comment) {
            onreject(
              "Sorry, couldn't find a performance score of 100. Ask in #aem-chat for help",
            );
            return;
          } else if (performance100Comment) {
            onsuccess({
              prData,
              performance100Comment,
            });
          }
        }
      }
    } catch (err) {
      onerror('An error occurred while checking your PR. 😭');
    }
  }
}
