<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\ConversationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Sylius\Bundle\ResourceBundle\Event\ResourceControllerEvent;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Purge (bulk delete) the conversations selected in the admin listing --
 * the manual counterpart to PurgeConversationsCommand's scheduled retention
 * purge.
 *
 * A dedicated route rather than Sylius's generic ResourceController::
 * bulkDeleteAction: for a grid-backed HTML resource (our ConversationGrid),
 * Sylius\Bundle\ResourceBundle\Controller\ResourcesCollectionProvider::get()
 * returns the raw ResourceGridView rather than its unwrapped Pagerfanta
 * data, and bulkDeleteAction then does a plain `foreach ($resources as
 * $resource)` over it. GridView's properties are all private, so that
 * foreach silently iterates zero times no matter how the grid is filtered
 * -- confirmed by direct testing, selecting rows and submitting never
 * removed anything -- while the controller still unconditionally flashes a
 * "successfully deleted" success message afterwards. Not fixable from
 * userland without patching the vendor, hence this instead.
 *
 * Dispatches the same `app.conversation.pre_delete` event the generic
 * delete/bulk_delete actions would have, so AuditLogListener keeps
 * recording conversation deletions made from the admin regardless of which
 * route triggered them.
 */
final class ConversationBulkDeleteController extends AbstractController
{
    #[Route('/admin/conversations/purge-selection', name: 'app_admin_conversation_purge_selection', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function __invoke(
        Request $request,
        EntityManagerInterface $entityManager,
        ConversationRepository $repository,
        EventDispatcherInterface $eventDispatcher,
    ): RedirectResponse {
        if (!$this->isCsrfTokenValid('conversation_purge_selection', (string) $request->request->get('_csrf_token'))) {
            throw new HttpException(403, 'Invalid CSRF token.');
        }

        $ids = array_map('intval', (array) $request->request->all('ids'));
        $conversations = $ids ? $repository->findBy(['id' => $ids]) : [];

        foreach ($conversations as $conversation) {
            $eventDispatcher->dispatch(new ResourceControllerEvent($conversation), 'app.conversation.pre_delete');
            $entityManager->remove($conversation);
        }
        $entityManager->flush();

        $this->addFlash('success', sprintf('%d conversation(s) supprimée(s).', count($conversations)));

        return $this->redirectToRoute('app_admin_conversation_index');
    }
}
