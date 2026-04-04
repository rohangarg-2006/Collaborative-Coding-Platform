const express = require('express');
const { check } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addCollaborator,
  removeCollaborator,
  updateProjectCode,
  joinProjectByInviteCode,
  updateCollaboratorRole,
  getProjectCollaborators,
  getProjectSessions
} = require('../controllers/projects');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Join project by invite code
router.post('/join', joinProjectByInviteCode);

router
  .route('/')
  .get(getProjects)
  .post(
    [
      check('name', 'Project name is required').not().isEmpty(),
      check('language', 'Valid programming language is required').isIn([
        'javascript', 'python', 'cpp', 'java', 'typescript', 'csharp', 'go', 'php', 'ruby', 'rust'
      ])
    ],
    createProject
  );

router
  .route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Collaborator management routes
router.get('/:id/collaborators', getProjectCollaborators);
router.put('/:id/collaborators/:userId', 
  [check('role', 'Role must be either viewer or editor').isIn(['viewer', 'editor'])],
  updateCollaboratorRole);

// Project sessions route
router.get('/:id/sessions', getProjectSessions);

router
  .route('/:id/collaborators')
  .post(
    [
      check('username', 'Username is required').not().isEmpty(),
      check('role', 'Role must be viewer, editor, or admin').isIn(['viewer', 'editor', 'admin'])
    ],
    addCollaborator
  );

router.delete('/:id/collaborators/:userId', removeCollaborator);

router.put('/:id/code', updateProjectCode);

module.exports = router;
