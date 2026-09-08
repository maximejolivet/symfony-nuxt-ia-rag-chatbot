<?php

namespace App\Command;

use App\Entity\Conversation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Retention purge for visitor conversations (name/first name/email are
 * collected during chat, see Conversation -- unbounded retention isn't a
 * good default). Deletes conversations inactive for longer than the
 * configured/given number of days; their Message rows cascade-delete at
 * the database level (see Message::$conversation JoinColumn, onDelete:
 * CASCADE), so a single DQL bulk DELETE is enough -- no need to load and
 * remove() entities one by one.
 *
 * Meant to run on a schedule (cron invoking `bin/console app:conversations:purge
 * --force` in prod, see docs/DEPLOYMENT.md) as well as on demand from the admin.
 */
#[AsCommand(name: 'app:conversations:purge', description: 'Delete conversations (and their messages) inactive for longer than the retention period')]
final class PurgeConversationsCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        #[Autowire(env: 'int:CONVERSATION_RETENTION_DAYS')]
        private readonly int $defaultRetentionDays,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('days', null, InputOption::VALUE_REQUIRED, 'Delete conversations not updated in this many days', (string) $this->defaultRetentionDays)
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Report how many conversations would be deleted, without deleting them')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Skip the confirmation prompt (required for non-interactive use, e.g. cron)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $days = (int) self::requireString($input->getOption('days'), 'days');
        if ($days < 1) {
            $io->error('--days must be a positive integer.');

            return Command::INVALID;
        }

        $cutoff = new \DateTimeImmutable(sprintf('-%d days', $days));

        $count = (int) $this->entityManager->createQueryBuilder()
            ->select('COUNT(c.id)')
            ->from(Conversation::class, 'c')
            ->where('c.updatedAt < :cutoff')
            ->setParameter('cutoff', $cutoff)
            ->getQuery()
            ->getSingleScalarResult();

        if (0 === $count) {
            $io->success(sprintf('No conversation inactive for more than %d day(s). Nothing to purge.', $days));

            return Command::SUCCESS;
        }

        if ((bool) $input->getOption('dry-run')) {
            $io->info(sprintf('%d conversation(s) inactive for more than %d day(s) would be deleted (dry run -- nothing was deleted).', $count, $days));

            return Command::SUCCESS;
        }

        if (!(bool) $input->getOption('force')) {
            if (!$input->isInteractive()) {
                $io->error('Refusing to delete without --force in a non-interactive run (e.g. cron). Pass --dry-run to preview, or --force to actually purge.');

                return Command::INVALID;
            }

            if (!$io->confirm(sprintf('Delete %d conversation(s) (and their messages) inactive for more than %d day(s)? This cannot be undone.', $count, $days), false)) {
                $io->warning('Aborted, nothing was deleted.');

                return Command::SUCCESS;
            }
        }

        $deleted = $this->entityManager
            ->createQuery('DELETE FROM App\Entity\Conversation c WHERE c.updatedAt < :cutoff')
            ->setParameter('cutoff', $cutoff)
            ->execute();

        $io->success(sprintf('Purged %d conversation(s) inactive for more than %d day(s) (messages cascade-deleted at the database level).', $deleted, $days));

        return Command::SUCCESS;
    }

    private static function requireString(mixed $value, string $name): string
    {
        if (!\is_string($value)) {
            throw new \InvalidArgumentException(sprintf('Expected "%s" to be a string.', $name));
        }

        return $value;
    }
}
