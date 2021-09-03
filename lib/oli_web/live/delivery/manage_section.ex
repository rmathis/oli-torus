defmodule OliWeb.Delivery.ManageSection do
  use OliWeb, :live_view

  import OliWeb.ViewHelpers,
    only: [
      is_admin?: 1,
      user_role: 2
    ]

  alias Lti_1p3.Tool.ContextRoles
  alias Oli.Delivery.Sections
  alias OliWeb.Router.Helpers, as: Routes

  def mount(_params, %{"section" => section, "current_user" => current_user}, socket) do
    # only permit instructor level access
    if is_admin?(%{assigns: %{current_author: current_user}}) or
         ContextRoles.has_role?(
           current_user,
           section.slug,
           ContextRoles.get_role(:context_instructor)
         ) do
      socket =
        socket
        |> assign(:section, section)
        |> assign(:current_user, current_user)

      {:ok, socket}
    else
      IO.inspect("REDDDDD")
      {:ok, redirect(socket, to: Routes.static_page_path(OliWeb.Endpoint, :unauthorized))}
    end
  end

  def render(assigns) do
    # link_text = dgettext("grades", "Download Gradebook")

    ~L"""
      <div class="mb-2">
        <%= link to: Routes.page_delivery_path(OliWeb.Endpoint, :index, @section.slug) do %>
          <i class="las la-arrow-left"></i> Back
        <% end %>
      </div>

      <h2><%= dgettext("section", "Manage Section") %></h2>

      <%= if user_role(@section, @current_user) == :administrator do %>
        <div class="card border-warning my-4">
          <h6 class="card-header">
            Admin Tools
          </h6>
          <div class="card-body border-warning">
            <h5 class="card-title">Unlink this Section</h5>
            <p class="card-text">If your section was created from the wrong project or you simply wish to start over, you can unlink this section.</p>
            <button type="button" class="btn btn-sm btn-outline-danger float-right" data-toggle="modal" data-target="#deleteSectionModal">Unlink Section</button>
          </div>
        </div>

        <!-- delete section modal -->
        <div class="modal fade" id="deleteSectionModal" tabindex="-1" role="dialog" aria-labelledby="deleteSectionModal" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="deleteSectionModal">Confirm Unlink Section</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                Are you sure you want to unlink this section?
                <div class="alert alert-danger my-2" role="alert">
                  <b>Warning:</b> This action cannot be undone
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" phx-click="unlink_section" phx-disable-with="Unlinking...">Confirm Unlink Section</button>
              </div>
            </div>
          </div>
        </div>
      <% end %>
    """
  end

  def handle_event("unlink_section", _, socket) do
    %{section: section} = socket.assigns

    {:ok, _deleted} = Sections.soft_delete_section(section)

    {:noreply, push_redirect(socket, to: Routes.delivery_path(socket, :index))}
  end
end