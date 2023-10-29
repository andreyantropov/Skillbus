const url = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  let clientsList;
  let tableViewClientsList;
  let autoCompleteList;

  showHashUser();
  await prepareEvironment();
  await updateTableView();


  async function showHashUser() {
    if (window.location.hash) {
      const client = await getClientByIdFromDataBase(window.location.hash.substring(1));
      await showModalWindow(client);
    }
  }

  async function updateTableView(filter) {
    showTableSpinner();
    await createDataSet(filter);
    autocomplete(document.getElementById('filter'), autoCompleteList);
    renderClientsTable(tableViewClientsList);
  }

  async function createDataSet(filter) {
    clientsList = !!filter ? await searchClientsInDataBase(filter) : await getClientsFromDataBase();
    tableViewClientsList = getViewClientsList(clientsList);
    autoCompleteList = tableViewClientsList.map(client => client.name);
  }

  function showTableSpinner() {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const spinnerContainer = document.createElement('div');
    const spinner = document.createElement('div');

    tr.classList.add('table__row', 'table__row_loading');
    td.classList.add('table__cell', 'table__cell_loading');
    td.rowSpan = 3;
    td.colSpan = 6;
    spinnerContainer.classList.add('text-center', 'spinner-container');
    spinner.classList.add('spinner-border');
    spinner.role = 'status';

    spinnerContainer.append(spinner);
    td.append(spinnerContainer);
    tr.append(td);

    const table = document.getElementById('clients-table');
    table.innerHTML = '';
    table.append(tr);
  }

  async function prepareEvironment() {
    createModalWindow();
    addNewClientBtnOnClick();
    addClientsTableFiltration();
    addClientsTableSorting();
  }

  function createModalWindow() {
    const clientsModal = document.getElementById('clients-modal-form');
    const clientsModalInstance = new bootstrap.Modal(clientsModal, {});
    clientsModal.addEventListener('hidden.bs.modal', () => {
      removeHash();

      const clientsForm = document.getElementById('clients-form');
      clientsForm.reset();

      const contactsContainer = document.getElementById('contacts-container');
      contactsContainer.innerHTML = '';
    });

    addContactsBtnOnClick();
    clientsFormOnSubmit();

    const cancelButton = document.getElementById('modal-cancel-btn');
    cancelButton.addEventListener('click', async () => {
      const id = document.getElementById('id').value;
      if (!!id) await deleteClient(id);
      clientsModalInstance.hide();
    });
  }

  function addContactsBtnOnClick() {
    const addContactBtn = document.getElementById('add-contact-btn');
    const contactsContainer = document.getElementById('contacts-container');
    addContactBtn.addEventListener('click', () => {
      contactsContainer.append( createContact() );
    });
  }

  function createContact(contact = { type: 'Телефон', value: '', }) {
    const inputGroup = document.createElement('div');
    const dropdownBtn = document.createElement('button');
    const dropdownMenu = createContactDropdownMenu(contactTypeOnClick);
    const contactControl = document.createElement('input');
    const deleteBtn = document.createElement('button');
    const deleteIcon = document.createElement('img');

    inputGroup.classList.add('contact__input-group', 'contact', 'input-group', 'mb-3');
    dropdownBtn.classList.add('contact__btn-dropdown', 'btn', 'btn-outline-secondary', 'dropdown-toggle');
    dropdownBtn.type = 'button';
    dropdownBtn.ariaExpanded = 'false';
    dropdownBtn.dataset.bsToggle = 'dropdown';
    dropdownBtn.textContent = contact.type;
    contactControl.classList.add('contact__control', 'form-control');
    contactControl.ariaLabel = 'Контакт пользователя';
    contactControl.placeholder = 'Введите данные контакта';
    contactControl.value = contact.value;
    contactControl.required = true;
    contactControl.type = getContactControlType(contact.type);
    deleteBtn.classList.add('contact__btn-delete', 'btn', 'btn-outline-secondary');
    deleteIcon.src = 'img/delete-contact.svg';
    deleteIcon.ariaHidden = true;

    deleteBtn.addEventListener('click', () => {
      inputGroup.remove();
    });

    deleteBtn.append(deleteIcon);
    inputGroup.append(dropdownBtn);
    inputGroup.append(dropdownMenu);
    inputGroup.append(contactControl);
    inputGroup.append(deleteBtn);

    function contactTypeOnClick(e) {
      dropdownBtn.textContent = e.target.textContent;
      contactControl.type = getContactControlType(e.target.textContent);
    }

    return inputGroup;
  }

  function createContactDropdownMenu(contactTypeOnClick) {
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('contact__dropdown', 'dropdown-menu');

    const contactsTypes = ['Телефон', 'Доп. телефон', 'Email', 'VK', 'Facebook'];
    for (const type of contactsTypes) {
      const item = document.createElement('li');
      const link = document.createElement('a');

      link.classList.add('dropdown-item');
      link.href = '#';
      link.textContent = type;

      link.addEventListener('click', contactTypeOnClick);

      item.append(link);
      dropdownMenu.append(item);
    }

    return dropdownMenu;
  }

  function getContactControlType(type) {
    switch (type) {
      case 'Телефон':
        return 'tel';
      case 'Email':
        return 'email';
      default:
        return 'text';
    }
  }

  function clientsFormOnSubmit() {
    const clientsForm = document.getElementById('clients-form');
    clientsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showClientSubmitSpinner(true);

      const clientsModal = document.getElementById('clients-modal-form');
      const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);

      const error = document.getElementById('error');
      error.innerHTML = '';

      const id = document.getElementById('id').value;
      const lastName = document.getElementById('last-name').value.trim();
      const firstName = document.getElementById('first-name').value.trim();
      const secondName = document.getElementById('second-name').value.trim();
      const contactsElements = Array.from(document.getElementsByClassName('contact__input-group'));
      const contacts = contactsElements.map((contact) => ({ type: contact.querySelector('.dropdown-toggle').textContent, value: contact.querySelector('.form-control').value.trim(), }));

      try {
        const client = !id ? await saveClientToDataBase({ id: id, surname: lastName, name: firstName, lastName: secondName, contacts: contacts, }) : await updateClientInDataBase({ _id: id, surname: lastName, name: firstName, lastName: secondName, contacts: contacts, });
        await updateTableView();
        clientsModalInstance.hide();
      } catch (e) {
        error.textContent = e;
      }
      showClientSubmitSpinner(false);
    });
  }

  function showClientSubmitSpinner(isLoading) {
    const submitBtn = document.getElementById('clients-submit-btn');
    submitBtn.disabled = isLoading;
    const submitSpinner = document.getElementById('clients-submit-spinner');
    submitSpinner.classList.toggle('hidden');
  }

  async function deleteClient(id) {
    if (!confirm('Вы уверены?')) return;
      await deleteClientFromDataBase(id);
      await updateTableView();
  }

  async function addNewClientBtnOnClick() {
    const addButton = document.getElementById('add-client-btn');
    addButton.addEventListener('click', async () => {
      await showModalWindow();
    });
  }

  async function showModalWindow(client) {
    !!client ? await showModalInEditMode(client) : showModalInInsertMode();

    const clientsModal = document.getElementById('clients-modal-form');
    const clientsModalInstance = bootstrap.Modal.getInstance(clientsModal);
    clientsModalInstance.show();
  }

  function showModalInInsertMode() {
    document.getElementById('modal-title').textContent = 'Новый клиент';
    document.getElementById('client-id-span').textContent = '';
    document.getElementById('id').value = '';
    document.getElementById('modal-cancel-btn').textContent = 'Отмена';
  }

  async function showModalInEditMode(client) {
    setHash(client.id);

    document.getElementById('modal-title').textContent = 'Изменить данные';
    document.getElementById('client-id-span').textContent = `ID: ${client.id}`;
    document.getElementById('modal-cancel-btn').textContent = 'Удалить клиента';

    await fillFormWithClientData(client);
  }

  async function fillFormWithClientData(client) {
    document.getElementById('id').value = client.id;
    document.getElementById('last-name').value = client.surname;
    document.getElementById('first-name').value = client.name;
    document.getElementById('second-name').value = client.lastName;

    contactsContainer = document.getElementById('contacts-container');
    for (const contact of client.contacts) {
      contactsContainer.append( createContact(contact) );
    }
  }

  function addClientsTableSorting() {
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
    for (const tableHeaderTitle of tableHeaders) {
      tableHeaderTitle.addEventListener('click', () => {
        if (tableHeaderTitle.classList.contains('sorted')) {
          resetSorting();
          tableHeaderTitle.classList.add('sorted-reverse');
        } else if (tableHeaderTitle.classList.contains('sorted-reverse')) {
          resetSorting();
        } else {
          resetSorting();
          tableHeaderTitle.classList.add('sorted');
        }
        renderClientsTable(tableViewClientsList);
      });
    }
  }

  function resetSorting() {
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
    for (const tableHeader of tableHeaders) {
      tableHeader.classList.remove('sorted', 'sorted-reverse');
    }
  }

  function addClientsTableFiltration() {
    const filter = document.getElementById('filter');
    let inputTimeout = 0;
    ['keyup', 'change'].forEach(event => {
      filter.addEventListener(event, (e) => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(async () => {
          await clientsFilterOnChange(e.target.value);
        }, 300);
      });
    });
  }

  async function clientsFilterOnChange(value) {
    await updateTableView(value);
  }

  function getViewClientsList(clientsList) {
    return clientsList.map((client) => clientMapper(client));
  }

  function clientMapper(client) {
    return ({ id: client.id, name: `${client.surname} ${client.name} ${client.lastName}`, createDate: new Date(client.createdAt), updateDate: new Date(client.updatedAt), contacts: client.contacts, });
  }

  async function renderClientsTable(clientsList) {
    const viewClientsList = sortClientsTable(clientsList);

    const table = document.getElementById('clients-table');
    table.innerHTML = '';

    for (const client of viewClientsList) {
      const clientElement = await createClientElement(client);
      table.append(clientElement);
    }
  }

  async function createClientElement(client) {
    const tr = document.createElement('tr');
    tr.classList.add('table__row');

    for (const [key, value] of Object.entries(client)) {
      key !== 'contacts' ? tr.append( fillCell(value) ) : tr.append( fillContactsCell(value) );
    }

    const td = document.createElement('td');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');
    const editIcon = document.createElement('img');
    const editSpinner = document.createElement('span');
    const deleteIcon = document.createElement('img');

    td.classList.add('table__cell', 'table__cell_actions');
    editIcon.src = 'img/edit.svg';
    editIcon.ariaHidden = true;
    deleteIcon.src = 'img/delete-client.svg';
    deleteIcon.ariaHidden = true;
    editSpinner.classList.add('spinner-border', 'spinner-border-sm', 'hidden');
    editSpinner.role = 'status';
    editSpinner.ariaHidden = true;
    editButton.classList.add('table__btn', 'table__btn_edit', 'btn');
    editButton.textContent = 'Изменить';
    editButton.prepend(editIcon);
    editButton.prepend(editSpinner);
    deleteButton.classList.add('table__btn', 'table__btn_delete', 'btn');
    deleteButton.textContent = 'Удалить';
    deleteButton.prepend(deleteIcon);

    function showEditBtnSpinner(isLoading) {
      editButton.disabled = isLoading;
      editIcon.classList.toggle('hidden');
      editSpinner.classList.toggle('hidden');
    }

    editButton.addEventListener('click', async () => {
      showEditBtnSpinner(true);
      const rowClient = await getClientByIdFromDataBase(client.id);
      await showModalWindow(rowClient);
      showEditBtnSpinner(false);
    });
    deleteButton.addEventListener('click', async () => {
      await deleteClient(client.id);
    });

    td.append(editButton);
    td.append(deleteButton);
    tr.append(td);

    return tr;
  }

  function fillCell(value) {
    const td = document.createElement('td');
    td.classList.add('table__cell');
    td.textContent = value;
    return td;
  }

  function fillContactsCell(contacts) {
    const td = document.createElement('td');
    td.classList.add('table__cell');
    for (const contact of contacts) {
      td.classList.add('table__cell_contacts');
      const icon = document.createElement('img');
      icon.src = getContactIcon(contact.type);
      icon.dataset.bsToggle = 'tooltip';
      icon.title = contact.value;
      icon.alt = 'Контакт клиента';
      td.append(icon);
    }
    return td;
  }

  function getContactIcon(type) {
    switch (type) {
      case 'Телефон':
        return 'img/phone.svg';
      case 'Email':
        return 'img/email.svg';
      case 'VK':
        return 'img/vk.svg';
      case 'Facebook':
        return 'img/facebook.svg';
      default:
        return 'img/contact.svg';
    }
  }

  function sortClientsTable(clientsList) {
    let sortedClientsList = [...clientsList];
    const tableHeaders = document.getElementsByClassName('table__header-title_sortable');
    for (const tableHeader of tableHeaders) {
      if (tableHeader.classList.contains('sorted')) {
        sortedClientsList = sortArrayByProperty(clientsList, bindSortValues(tableHeader.id), false);
      } else if (tableHeader.classList.contains('sorted-reverse')) {
        sortedClientsList = sortArrayByProperty(clientsList, bindSortValues(tableHeader.id), true);
      }
    }
    return sortedClientsList;
  }

  function bindSortValues(id) {
    switch (id) {
      case 'id-header':
        return 'id';
      case 'name-header':
        return 'name';
      case 'create-date-header':
        return 'createDate';
      case 'update-date-header':
        return 'updateDate';
    }
  }

  function sortArrayByProperty(arr, prop, dir) {
    const sortedArr = [...arr];
    return sortedArr.sort((a, b) => (!dir ? a[prop] < b[prop] : a[prop] > b[prop]) ? -1 : 1);
  }

  async function saveClientToDataBase(client) {
    const response = await fetch(`${url}/api/clients`, {
      method: 'POST',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const newClient = await response.json();
    if (!response.ok) throw new Error(`Error ${response.status}: ${newClient.message ?? 'Что-то пошло не так...'}`);
    return newClient;
  }

  async function updateClientInDataBase(client) {
    const response = await fetch(`${url}/api/clients/${client.id}`, {
      method: 'PATCH',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const updatedClient = await response.json();
    if (!response.ok) throw new Error(`Error ${response.status}: ${updatedClient.message ?? 'Что-то пошло не так...'}`);
    return updatedClient;
  }

  async function getClientsFromDataBase() {
    const response = await fetch(`${url}/api/clients`);
    const clientsList = await response.json();
    return clientsList;
  }

  async function getClientByIdFromDataBase(id) {
    const response = await fetch(`${url}/api/clients/${id}`);
    const client = await response.json();
    return client;
  }

  async function searchClientsInDataBase(filter) {
    const response = await fetch(`${url}/api/clients?search=${filter}`);
    const filteredClientsList = await response.json();
    return filteredClientsList;
  }

  async function deleteClientFromDataBase(id) {
    await fetch(`${url}/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  function setHash(hash) {
    window.location.hash = hash;
  }

  function removeHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
});
